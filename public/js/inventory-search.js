document.addEventListener('DOMContentLoaded', function() {
    var sidenavs = document.querySelectorAll('.sidenav');
    var inventorySearch = M.Sidenav.init(sidenavs, {});
    var collapsibles = document.querySelectorAll('.collapsible');
    var inventoryCollapsibles = M.Collapsible.init(collapsibles, {});
  });
