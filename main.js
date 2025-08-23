// Toggle mobile menu
let menu = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

menu.onclick = () => {
  navbar.classList.toggle('active');
};

window.onscroll = () => {
  navbar.classList.remove('active');
};

// Contact form -> Gmail
document.getElementById("contactForm").addEventListener("submit", function(event) {
  event.preventDefault();

  let name = document.getElementById("name").value;
  let email = document.getElementById("email").value;
  let message = document.getElementById("message").value;

  let subject = "Contact from Bug Hunt Code Club";
  let body = `Name: ${name}%0D%0AEmail: ${email}%0D%0A%0D%0AMessage:%0D%0A${message}`;

  window.open(
    `https://mail.google.com/mail/?view=cm&fs=1&to=codingclubpvpsit2025@gmail.com&su=${encodeURIComponent(subject)}&body=${body}`,
    '_blank'
  );
});

// Scroll reveal animation
ScrollReveal().reveal('.home .text, .heading, .box, form', {
  delay: 200,
  distance: '40px',
  origin: 'bottom',
  duration: 800,
  reset: true
});
