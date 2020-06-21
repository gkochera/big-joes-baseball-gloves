
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
    gap: 30,
    autoplay: 4000,
    hoverpause: true
})


// Resizes the carousel based on the width of the window. Fires on resize event.
function resizeCarousel(){
    var width = document.getElementsByTagName('html')[0].clientWidth
    console.log(width)
    if (width <= 589) {
        carousel.update({perView: 1})
        console.log(width)
    } else if (width <= 976 && width > 589) {
        carousel.update({perView: 2})
        console.log(width)
    } else if (width > 976) {
        carousel.update({perView: 3})
        console.log(width)
    }
}


carousel.on('resize', resizeCarousel)
carousel.mount()

