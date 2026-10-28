// ==============================================================================
// Small Software Cloud - Injected SDK Client Script
// This script is injected into every served single-file app before rendering.
// It bridges the sandboxed iframe to the parent host window via postMessage.
// ==============================================================================

export const INJECTED_SDK_CODE = `
(function() {
  if (window.cloud) return;

  var pendingRequests = {};
  var subscribers = {};
  var cachedUser = null;

  function generateId() {
    return 'req_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  }

  function sendHostMessage(type, payload) {
    return new Promise(function(resolve, reject) {
      var requestId = generateId();
      pendingRequests[requestId] = { resolve: resolve, reject: reject };
      
      // Send postMessage to parent window
      window.parent.postMessage({
        source: 'cloud_sdk',
        type: type,
        requestId: requestId,
        payload: payload
      }, '*');

      // Timeout safety after 10 seconds
      setTimeout(function() {
        if (pendingRequests[requestId]) {
          pendingRequests[requestId].reject(new Error('SDK request timeout: ' + type));
          delete pendingRequests[requestId];
        }
      }, 10000);
    });
  }

  // Listen for responses and broadcasts from parent host
  window.addEventListener('message', function(event) {
    var data = event.data;
    if (!data || typeof data !== 'object') return;

    // Handle Request/Response replies
    if (data.type === 'SDK_RESPONSE' && data.requestId) {
      var handler = pendingRequests[data.requestId];
      if (handler) {
        if (data.success) {
          handler.resolve(data.data);
        } else {
          handler.reject(new Error(data.error || 'Operation failed'));
        }
        delete pendingRequests[data.requestId];
      }
    }

    // Handle Realtime Broadcast Updates
    if (data.type === 'SDK_BROADCAST' && data.key) {
      var cbs = subscribers[data.key] || [];
      for (var i = 0; i < cbs.length; i++) {
        try {
          cbs[i](data.value, { key: data.key, updatedBy: data.updatedBy });
        } catch (err) {
          console.error('[Cloud SDK] Subscriber callback error:', err);
        }
      }

      // Also notify wildcard '*' subscribers
      var wildcardCbs = subscribers['*'] || [];
      for (var j = 0; j < wildcardCbs.length; j++) {
        try {
          wildcardCbs[j](data.value, { key: data.key, updatedBy: data.updatedBy });
        } catch (err) {
          console.error('[Cloud SDK] Wildcard subscriber callback error:', err);
        }
      }
    }
  });

  // Expose window.cloud API
  window.cloud = {
    // Current viewer profile { id, name, email } or null if anonymous
    user: function() {
      if (cachedUser) return Promise.resolve(cachedUser);
      return sendHostMessage('GET_USER', {}).then(function(user) {
        cachedUser = user;
        return user;
      });
    },

    store: {
      // Read shared JSON value
      get: function(key) {
        return sendHostMessage('STORE_GET', { key: key });
      },

      // Write shared JSON value (editors and owners, or per-user key for viewers)
      set: function(key, value) {
        return sendHostMessage('STORE_SET', { key: key, value: value });
      },

      // List keys matching prefix
      list: function(prefix) {
        return sendHostMessage('STORE_LIST', { prefix: prefix || '' });
      },

      // Realtime subscription: cb(value, { key, updatedBy })
      // Returns an unsubscribe function
      subscribe: function(key, callback) {
        if (typeof callback !== 'function') {
          throw new Error('Subscriber must be a callback function');
        }
        if (!subscribers[key]) {
          subscribers[key] = [];
        }
        subscribers[key].push(callback);

        // Notify parent to register realtime subscription for this key
        sendHostMessage('STORE_SUBSCRIBE', { key: key }).catch(function(e) {
          console.warn('[Cloud SDK] Subscribe notify warn:', e);
        });

        // Return unsubscribe function
        return function unsubscribe() {
          if (subscribers[key]) {
            subscribers[key] = subscribers[key].filter(function(cb) {
              return cb !== callback;
            });
          }
        };
      }
    }
  };

  // Signal to parent window that the app SDK is ready
  window.parent.postMessage({
    source: 'cloud_sdk',
    type: 'SDK_READY'
  }, '*');

  console.log('[Cloud SDK] Initialized successfully. window.cloud ready.');
})();
`;

/**
 * Injects the Cloud SDK into an HTML string before serving it.
 */
export function injectSDKIntoHtml(html: string): string {
  const sdkScriptTag = `<script id="cloud-sdk-script">\n${INJECTED_SDK_CODE}\n</script>`;

  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>\n${sdkScriptTag}`);
  } else if (html.includes('<html>')) {
    return html.replace('<html>', `<html>\n<head>\n${sdkScriptTag}\n</head>`);
  } else {
    return `<head>\n${sdkScriptTag}\n</head>\n${html}`;
  }
}
