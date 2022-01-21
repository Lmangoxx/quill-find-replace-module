const quill = new Quill('#editor', {
	theme: 'snow',
  scrollingContainer: '#editor-scroller',
	modules: {
		findReplace: true
	}
});


const findReplaceModule = quill.getModule('findReplace');
findReplaceModule.show();