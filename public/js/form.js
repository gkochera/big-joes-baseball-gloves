
// Lever in Form Value
var form = document.getElementById("contact_us");
form.addEventListener('submit', function() {
    if(document.getElementById("email_list_signup").checked) {
        document.getElementById("email_list_signup_hidden").disabled = true
    }
})