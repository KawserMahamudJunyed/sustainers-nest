/* Sustainers NEST - Vercel Web Analytics
   Intentionally disabled on Netlify preview deployments and local/file previews.
   On Vercel, enable Web Analytics in the project dashboard after deployment. */
(function () {
  var host = window.location.hostname || '';
  var isNetlifyPreview = /(?:^|\.)netlify\.app$/i.test(host);
  var isLocal = window.location.protocol === 'file:' || host === 'localhost' || host === '127.0.0.1';
  if (isNetlifyPreview || isLocal) return;

  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };

  var script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/insights/script.js';
  document.head.appendChild(script);
})();
