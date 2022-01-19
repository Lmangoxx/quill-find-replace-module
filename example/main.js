const quill = new Quill('#editor', {
	theme: 'snow',
	modules: {
    findReplace: true
	}
});


const findReplaceModule = quill.getModule('findReplace');
findReplaceModule.show();