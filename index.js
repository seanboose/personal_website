function smoothScroll(loc) {
	$('html, body').animate({
		scrollTop: $(loc).offset().top
	}, 2000);
	return false;
};

var main = function() {

	$('.scroll').click(function(e) {
		e.preventDefault();
		smoothScroll($(this).attr('href'));
	});
};

$(document).ready(main);