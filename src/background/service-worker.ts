/**
 * JobTrack - Service Worker (Manifest V3)
 * Handles context menus, commands, and tab interaction coordination.
 * Ephemeral: Does not store in-memory state.
 */

// Initialize on extension installation
chrome.runtime.onInstalled.addListener(async () => {
  // Setup context menu item for direct tracking
  chrome.contextMenus.create({
    id: 'jobtrack_track_page',
    title: 'Track application with JobTrack',
    contexts: ['page', 'selection', 'link'],
  });

  console.log('JobTrack extension installed and context menu initialized.');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'jobtrack_track_page' && tab?.id) {
    try {
      if (tab.windowId && chrome.sidePanel?.open) {
        await chrome.sidePanel.open({ windowId: tab.windowId });
      }
      // Broadcast tracking request to sidepanel or popup
      chrome.runtime.sendMessage({
        action: 'TRIGGER_TRACK_CURRENT_PAGE',
        tabId: tab.id,
      });
    } catch (err) {
      console.error('Error opening side panel from context menu:', err);
    }
  }
});

// Handle keyboard shortcuts (Alt+Shift+J, Alt+Shift+P)
chrome.commands.onCommand.addListener(async (command) => {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab?.windowId) return;

    if (command === 'open_side_panel' || command === 'track_current_job') {
      if (chrome.sidePanel?.open) {
        await chrome.sidePanel.open({ windowId: activeTab.windowId });
      }
      if (command === 'track_current_job') {
        setTimeout(() => {
          chrome.runtime.sendMessage({
            action: 'TRIGGER_TRACK_CURRENT_PAGE',
            tabId: activeTab.id,
          });
        }, 300);
      }
    }
  } catch (err) {
    console.error('Command handling error:', err);
  }
});

// Handle message passing between popup/sidepanel/dashboard
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
