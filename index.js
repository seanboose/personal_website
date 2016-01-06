function smoothScroll(loc) {
	$('html, body').animate({
		scrollTop: $(loc).offset().top
	}, 2000);
};

var main = function() {

	$('.scroll').click(function() {
		smoothScroll($(this).attr('href'));
	});
};

$(document).ready(main);