
// Materialize
document.addEventListener('DOMContentLoaded', function() {
    
    // Sidebar - Nav
    var elems = document.querySelectorAll('.sidenav');
    var options = {edge: 'left'}
    var instances = M.Sidenav.init(elems, options);

    // Selectbox
    elems = document.querySelectorAll('select');
    instances += M.FormSelect.init(elems, {
        classes: 'input-field',
        dropdownOptions:
        {1: 'order_question',
        2: 'return_request',
        3: 'item_inquiry',
        4: 'repair_inquiry'}
    });
})

// Carousel
carousel = new Glide('.glide', {
    type: 'carousel',
    startAt: 0,
    perView: 3,
    gap: 0,
    autoplay: 4000,
    hoverpause: true
})

carousel.mount()