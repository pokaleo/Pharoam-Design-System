/* Pharoam's own interface glyphs, added to the icon sprite: the AI monogram.
   Copyright 2026 The Pharoam authors. All rights reserved. */
(function(){
  var S='<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true"><defs>'+"<symbol id=\"i-ai\" viewBox=\"0 0 24 24\"><rect x=\"2.5\" y=\"4.5\" width=\"19\" height=\"15\" rx=\"3\" stroke-dasharray=\"3 2.2\"/><path d=\"M7 15.5l2.5-7l2.5 7M7.9 13h3.2M15.5 8.5v7\"/></symbol>"+'</defs></svg>';
  function inject(){ document.body.insertAdjacentHTML('afterbegin', S); }
  if (document.body) inject(); else document.addEventListener('DOMContentLoaded', inject);
})();
