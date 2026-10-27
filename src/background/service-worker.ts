/**
 * JobTrack - Service Worker (Manifest V3)
 * Handles background tracking, LLM extraction coordination, duplicate detection, and notifications.
 * Persistent task execution that survives popup closures and tab changes.
 */

import { performJobExtraction } from '../lib/llm/provider';
import { getSettings, saveApplication, updateApplication, getStoredApplications } from '../lib/storage';
import { checkDuplicateApplication } from '../lib/duplicate';
import { RawPageData } from '../types/extractor';

// Initialize on extension installation
chrome.runtime.onInstalled.addListener(async () => {
  // Clear any stale tracking state
  try {
    const data = await chrome.storage.local.get(['jobtrack_active_tracking']);
    if (data.jobtrack_active_tracking) {
      await chrome.storage.local.remove('jobtrack_active_tracking');
    }
  } catch {}

  // Setup context menu item for direct tracking
  chrome.contextMenus.create({
    id: 'jobtrack_track_page',
    title: 'Track application with JobTrack',
    contexts: ['page', 'selection', 'link'],
  });

  console.log('JobTrack extension installed and context menu initialized.');
});

/**
 * Executes full job extraction in the background service worker.
 * Runs completely independently of the popup or other open tabs.
 */
async function startBackgroundTracking(tabId: number, initialPageData?: RawPageData | null) {
  try {
    let pageData: RawPageData | null = initialPageData || null;
    let tabUrl = pageData?.url || '';

    if (!tabUrl) {
      try {
        const tab = await chrome.tabs.get(tabId);
        tabUrl = tab.url || '';
      } catch {}
    }

    // Guard against restricted internal URLs if no pageData
    if (
      !pageData &&
      (tabUrl.startsWith('chrome://') ||
        tabUrl.startsWith('chrome-extension://') ||
        tabUrl.startsWith('edge://') ||
        tabUrl.startsWith('about:') ||
        tabUrl.startsWith('view-source:'))
    ) {
      console.warn('Cannot track internal browser pages:', tabUrl);
      return;
    }

    // 0. Persist active tracking state so popup and dashboard can display live status non-blockingly
    const activeTracking = {
      tabId,
      pageUrl: pageData?.url || tabUrl || '',
      jobTitle: pageData?.title || 'Job Listing',
      detectedSource: pageData?.detectedSource || '',
      startedAt: Date.now(),
      status: 'extracting',
    };
    await chrome.storage.local.set({ jobtrack_active_tracking: activeTracking });
    try {
      await chrome.action.setBadgeText({ text: 'AI' });
      await chrome.action.setBadgeBackgroundColor({ color: '#E05638' });
    } catch {}

    // 1. Ensure content script is injected in the target tab for in-page pill
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content-script.js'],
      });
    } catch {
      // Content script may already be injected or tab was closed
    }

    // 2. Instruct tab to display the tracking card that slowly minimizes into a pill
    try {
      await chrome.tabs.sendMessage(tabId, { action: 'SHOW_TRACKING_PILL' });
    } catch (e) {
      console.debug('Could not send SHOW_TRACKING_PILL yet:', e);
    }

    // 3. Extract page metadata if not already pre-extracted from the popup
    if (!pageData) {
      try {
        const res = await chrome.tabs.sendMessage(tabId, { action: 'EXTRACT_PAGE_DATA' });
        if (res?.success && res.data) {
          const extractedPage = res.data;
          pageData = extractedPage;
          await chrome.storage.local.set({
            jobtrack_active_tracking: {
              ...activeTracking,
              pageUrl: extractedPage.url || activeTracking.pageUrl,
              jobTitle: extractedPage.title || activeTracking.jobTitle,
              detectedSource: extractedPage.detectedSource || activeTracking.detectedSource,
            },
          });
        }
      } catch (e) {
        console.debug('Direct tab message for EXTRACT_PAGE_DATA failed, using fallback:', e);
      }
    }

    if (!pageData) {
      pageData = {
        url: tabUrl,
        title: 'Job Listing',
        domain: tabUrl ? new URL(tabUrl).hostname : '',
        metaTags: {},
        jsonLdList: [],
        headings: ['Job Listing'],
        cleanTextSnippet: '',
        detectedSource: tabUrl ? new URL(tabUrl).hostname : 'web',
      };
    }

    // 4. Perform LLM Extraction in Background
    const settings = await getSettings();
    const extractionRes = await performJobExtraction(pageData, settings.ai);
    const extractedData = extractionRes.data;

    // 5. Check if this application was already tracked (Duplicate Detection)
    const existingApps = await getStoredApplications();
    const duplicateInfo = checkDuplicateApplication(
      {
        url: pageData.url,
        company: extractedData.company,
        role: extractedData.role,
      },
      existingApps
    );

    // 6. Store pending item so user can approve from ANY tab or popup
    const pendingItem = {
      tabId,
      pageUrl: pageData.url,
      extractedData,
      duplicateInfo,
      timestamp: Date.now(),
    };
    await chrome.storage.local.set({ jobtrack_pending_approval: pendingItem });

    // 7. Remove active tracking state now that extraction is complete
    await chrome.storage.local.remove('jobtrack_active_tracking');

    // 8. Set extension badge GLOBALLY to alert user across all tabs (including YouTube)
    try {
      await chrome.action.setBadgeText({ text: '1' });
      await chrome.action.setBadgeBackgroundColor({
        color: duplicateInfo.isDuplicate ? '#F59E0B' : '#E05638',
      });
    } catch {}

    // 9. Send Chrome System Notification so user is alerted even while browsing YouTube
    try {
      if (chrome.notifications) {
        chrome.notifications.create('jobtrack_ready_' + Date.now(), {
          type: 'basic',
          iconUrl: 'icons/icon-128.png',
          title: duplicateInfo.isDuplicate ? 'JobTrack — Duplicate Detected' : 'JobTrack — Ready for Approval',
          message: `${extractedData.role || 'Job Application'} at ${extractedData.company || 'Company'} is ready for approval. Click to review.`,
          priority: 2,
        });
      }
    } catch (e) {
      console.debug('Notification create error:', e);
    }

    // 10. Try to open the extension popup automatically
    try {
      if (chrome.action?.openPopup) {
        const tab = await chrome.tabs.get(tabId).catch(() => null);
        if (tab?.windowId) {
          await chrome.action.openPopup({ windowId: tab.windowId });
        } else {
          await chrome.action.openPopup();
        }
      }
    } catch (e) {
      console.debug('Automatic openPopup not available or requires user gesture:', e);
    }

    // 11. Notify the original tab if it is still alive
    try {
      await chrome.tabs.sendMessage(tabId, {
        action: 'TRACKING_COMPLETE',
        data: extractedData,
        pageUrl: pageData.url,
        duplicateInfo,
      });
    } catch (e) {
      console.debug('Tab was not reachable for immediate TRACKING_COMPLETE notification; pending item stored in local storage', e);
    }
  } catch (err: any) {
    console.error('Background tracking error:', err);
    await chrome.storage.local.remove('jobtrack_active_tracking');
    try {
      await chrome.action.setBadgeText({ text: '' });
    } catch {}
    try {
      await chrome.tabs.sendMessage(tabId, {
        action: 'TRACKING_ERROR',
        error: err.message || 'Error extracting job details.',
      });
    } catch {}
  } finally {
    try {
      const check = await chrome.storage.local.get(['jobtrack_active_tracking', 'jobtrack_pending_approval']);
      if (check.jobtrack_active_tracking && check.jobtrack_pending_approval) {
        await chrome.storage.local.remove('jobtrack_active_tracking');
      }
    } catch {}
  }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'jobtrack_track_page' && tab?.id) {
    await startBackgroundTracking(tab.id);
  }
});

// Handle keyboard shortcuts (Alt+Shift+J, Alt+Shift+P)
chrome.commands.onCommand.addListener(async (command) => {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab?.id) return;

    if (command === 'track_current_job') {
      await startBackgroundTracking(activeTab.id);
    } else if (command === 'open_side_panel') {
      if (activeTab.windowId && chrome.sidePanel?.open) {
        await chrome.sidePanel.open({ windowId: activeTab.windowId });
      }
    }
  } catch (err) {
    console.error('Command handling error:', err);
  }
});

// Handle notification clicks so the user can open JobTrack directly
if (chrome.notifications?.onClicked) {
  chrome.notifications.onClicked.addListener(async (notificationId) => {
    if (notificationId.startsWith('jobtrack_ready_')) {
      try {
        chrome.notifications.clear(notificationId);
      } catch {}

      // Attempt to open the extension popup
      try {
        if (chrome.action?.openPopup) {
          await chrome.action.openPopup();
          return;
        }
      } catch (err) {
        console.debug('openPopup from notification click failed:', err);
      }

      // Fallback: Focus the tab where the job was tracked
      try {
        const stored = await chrome.storage.local.get('jobtrack_pending_approval');
        if (stored.jobtrack_pending_approval?.tabId) {
          const tab = await chrome.tabs.get(stored.jobtrack_pending_approval.tabId);
          if (tab?.id) {
            await chrome.tabs.update(tab.id, { active: true });
            if (tab.windowId) {
              await chrome.windows.update(tab.windowId, { focused: true });
            }
          }
        }
      } catch (err) {
        console.debug('Tab focus fallback failed:', err);
      }
    }
  });
}

// Handle message passing between popup/sidepanel/content-script/dashboard
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'START_BACKGROUND_TRACKING') {
    const targetTabId = message.tabId || sender.tab?.id;
    if (targetTabId) {
      startBackgroundTracking(targetTabId, message.pageData);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'No tab id provided' });
    }
    return true;
  }

  if (message.action === 'CANCEL_ACTIVE_TRACKING') {
    (async () => {
      await chrome.storage.local.remove('jobtrack_active_tracking');
      try {
        await chrome.action.setBadgeText({ text: '' });
      } catch {}
      sendResponse({ success: true });
    })();
    return true;
  }

  if (message.action === 'SAVE_APPLICATION_FROM_CONTENT') {
    (async () => {
      try {
        if (message.updateExistingId && message.application) {
          // Update existing application record
          await updateApplication(message.updateExistingId, {
            ...message.application,
            id: message.updateExistingId,
          });
          await chrome.storage.local.remove(['jobtrack_pending_approval', 'jobtrack_active_tracking']);
          try {
            await chrome.action.setBadgeText({ text: '' });
          } catch {}
          sendResponse({ success: true, updated: true });
        } else if (message.application) {
          // Save new application
          await saveApplication(message.application);
          await chrome.storage.local.remove(['jobtrack_pending_approval', 'jobtrack_active_tracking']);
          try {
            await chrome.action.setBadgeText({ text: '' });
          } catch {}
          sendResponse({ success: true, updated: false });
        } else {
          sendResponse({ success: false, error: 'No application provided' });
        }
      } catch (err: any) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'DISCARD_PENDING_APPROVAL') {
    (async () => {
      await chrome.storage.local.remove(['jobtrack_pending_approval', 'jobtrack_active_tracking']);
      try {
        await chrome.action.setBadgeText({ text: '' });
      } catch {}
      sendResponse({ success: true });
    })();
    return true;
  }

  if (message.action === 'OPEN_POPUP') {
    (async () => {
      try {
        if (chrome.action?.openPopup) {
          const windowId = sender.tab?.windowId;
          if (windowId) {
            await chrome.action.openPopup({ windowId });
          } else {
            await chrome.action.openPopup();
          }
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'chrome.action.openPopup is not supported' });
        }
      } catch (err: any) {
        console.debug('openPopup invocation failed:', err);
        sendResponse({ success: false, error: err?.message });
      }
    })();
    return true;
  }

  if (message.action === 'OPEN_DASHBOARD') {
    const dashboardUrl = chrome.runtime.getURL('dashboard.html');
    chrome.tabs.create({ url: dashboardUrl });
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'OPEN_SIDEPANEL') {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.windowId && chrome.sidePanel?.open) {
          await chrome.sidePanel.open({ windowId: tab.windowId });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Side panel not available' });
        }
      } catch (err: any) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  return true;
});
