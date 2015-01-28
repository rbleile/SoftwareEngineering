
// Create a screen object.
var screen = blessed.screen();

var log = blessed.scrollabletext({
    parent: screen,
    mouse: true,
    keys: true,
    vi: true,
    border: {
	type: 'line',
	fg: '#00ff00'
    },
    scrollbar: {
	fg: 'blue',
	ch: '|'
    },
    width: '100%',
    height: '60%',
    top: '20%',
    left: 'left',
    align: 'left',
    tags: true
});
        
var box = blessed.box({
    parent: screen,
    top: '0%',
    left: 'left',
    width: '100%',
    height: '20%',
    content: '',
    tags: true,
    border: {
	type: 'line',
	fg: 'white'
    },
    style: {
	fg: 'white',
	bg: 'black',
	border: {
	    fg: '#f0f0f0'
	}
    }
});

//TODO: Only the EAST and WEST TURNSTILES should display this box.
var visitor = blessed.box({
    parent: screen,
    top: '80%',
    height: '20%',
    width: '50%',
    left: '0%',
    border: {
	type: 'line',
	fg: '#ffffff'
    },
    fg: '#ffffff',
    bg: '#228822',
    content: '{center}V = Admit Visitor{/center}',
    tags: true,
    hoverEffects: {
	bg: 'green'
    }
});

function admitVisitor() {
    //TODO: This function is where you start...
    //      i.e. attempt to acquire.

    visitor.setContent('{center}VISITOR!!{/center}');
    visitor.style.bg = '#222288';
    visitor.style.fg = '#ffffff';
    screen.render();

    //TODO: When the lock is acquired, set the colors back to bg='#228822'
}

screen.key(['v', 'V'], function(ch, key) {
    admitVisitor();
});

screen.key(['escape', 'q', 'Q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

visitor.focus();
screen.render();

