class paint {
    constructor() {
        this.temp = 0;
        this.countUndo = 0;
        this.canvas = document.getElementById('board');
        this.canvas.width = 800;
        this.canvas.height = 500;
        this.ctx = this.canvas.getContext('2d');
        this.drawBackground();
        this.arrUndo = [];

        this.color = '#ff0000';
        this.tool = 'pen'; // circle, rectangle, line
        this.lineWidth = 5;

        this.currentPos = {
                x: 0,
                y: 0
            }
            //propertise tool line
        this.startPos = {
                x: 0,
                y: 0
            }
            //propertise tool circle
        this.midPoint = {
            x: 0,
            y: 0
        }
        this.R = 0;
        //
        this.drawing = false;
        this.img = null;


        //listen mouse event
        this.listenEvent();
        var that = this;

        socket.on("undo", function() {
            that.ctx.drawImage(that.arrUndo[that.countUndo - 1], 0, 0, 800, 500);
            that.countUndo--;
        })

        socket.on("redo", function() {
            that.ctx.drawImage(that.arrUndo[that.countUndo + 1], 0, 0, 800, 500);
            that.countUndo++;
        })

        socket.on("mouse_down", function(data) {
            // paint_nsp.on("mouse_down",function (data){
            that.img = new Image;
            that.img.src = that.canvas.toDataURL("image/bmp", 1.0);
            that.arrUndo[that.countUndo] = that.img;
            let mousePos = that.getMousePos(event);
            that.startPos = data.startPos;
        })

        socket.on("lineTemp", function() {
            that.temp = that.arrUndo.length;
            that.ctx.drawImage(that.arrUndo[that.temp - 1], 0, 0, 800, 500);
            that.temp--;
        })

        socket.on('drawRect', function(data) {
            that.ctx.lineWidth = data.lineWidth;
            that.ctx.strokeStyle = data.color;
            that.ctx.beginPath();
            that.ctx.rect(data.startPos.x, data.startPos.y,
                data.endPos.x - data.startPos.x, data.endPos.y - data.startPos.y);
            that.ctx.stroke();
        })

        socket.on("drawLine", function(data) {
            that.ctx.lineWidth = data.lineWidth;
            that.ctx.strokeStyle = data.color;
            that.ctx.beginPath();
            that.ctx.moveTo(data.startPos.x, data.startPos.y);
            that.ctx.lineTo(data.endPos.x, data.endPos.y);
            that.ctx.lineCap = 'round';
            that.ctx.lineJoin = 'round';
            that.ctx.stroke();
        })

        socket.on("mouse_move", function(data) {
            // paint_nsp.on("mouse_move",function (data){
            if (data.drawing) {
                that.color = data.color;
                that.lineWidth = data.lineWidth;
                that.drawLine(that.currentPos, data.mousePos);
            }
            that.currentPos = data.mousePos;
        })

        socket.on("mouse_up", function() {
            that.countUndo++;
            that.img = new Image;
            that.img.src = that.canvas.toDataURL("image/bmp", 1.0);
            that.arrUndo[that.countUndo] = that.img;
        })
    }

    canDraw() {
        let can = false;
        let role = sessionStorage.getItem('role');
        if (role === 'drawer') {
            can = true;
        }
        return can;
    }

    //mouse event
    getMousePos(evt) {
        var rect = this.canvas.getBoundingClientRect();
        return {
            x: evt.pageX - rect.left,
            y: evt.pageY - rect.top
        }
    }

    mousedown(event) {
        this.img = new Image;
        this.img.src = this.canvas.toDataURL("image/bmp", 1.0);
        this.arrUndo[this.countUndo] = this.img;
        let mousePos = this.getMousePos(event);
        this.startPos = this.getMousePos(event);
        if (this.canDraw()) {
            this.drawing = true;
        }
        let that = this;
        socket.emit("mouse_down", that.startPos);
        // paint_nsp.emit("mouse_down",that.startPos);
    }

    mousedraw(tool, currentPos, mousePos) {
        switch (tool) {
            case 'pen':
                this.drawLine(currentPos, mousePos);
                break;
            case 'line':
                this.lineTemp();
                this.drawLine(this.startPos, mousePos);
                break;
            case 'rect':
                this.lineTemp();
                this.drawRect(this.startPos, mousePos);
                break;
        }
    }

    mousemove(event) {
        let mousePos = this.getMousePos(event);
        if (this.drawing) {
            this.mousedraw(this.tool, this.currentPos, mousePos);
        }
        this.currentPos = mousePos;
        var that = this;
        // socket.emit('mouse_move', {tool:that.tool, drawing:that.drawing, mousePos:mousePos,color:that.color,lineWidth:that.lineWidth});
        // paint_nsp.emit('mouse_move', {tool:that.tool, drawing:that.drawing, mousePos:mousePos});
    }
    mouseup(event) {
        this.drawing = false;
        this.countUndo++;
        this.img = new Image;
        this.img.src = this.canvas.toDataURL("image/bmp", 1.0);
        this.arrUndo[this.countUndo] = this.img;
        socket.emit('mouse_up')
    }

    listenEvent() {
            this.canvas.addEventListener(
                'mousedown',
                (event) => this.mousedown(event)
            );
            this.canvas.addEventListener(
                'mousemove',
                (event) => this.mousemove(event)
            );
            this.canvas.addEventListener(
                'mouseup',
                (event) => this.mouseup(event)
            );
            this.canvas.addEventListener('mouseover', e => { this.getMousePos(e) })
        }
        //undo and redo

    undo() {
        if (this.countUndo == 0) {
            return;
        }
        socket.emit('undo');
        this.ctx.drawImage(this.arrUndo[this.countUndo - 1], 0, 0, 800, 500);
        this.countUndo--;
    }

    redo() {
        if (this.countUndo + 1 == this.arrUndo.length) {
            return;
        }
        socket.emit('redo');
        this.ctx.drawImage(this.arrUndo[this.countUndo + 1], 0, 0, 800, 500);
        this.countUndo++;
    }

    clear() {
        this.ctx.drawImage(this.arrUndo[0], 0, 0, 800, 500);
        this.countUndo = 0;
    }

    drawBackground() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, 800, 500);
    }

    //method for tool
    lineTemp() {
        this.temp = this.arrUndo.length;
        socket.emit('lineTemp');
        this.ctx.drawImage(this.arrUndo[this.temp - 1], 0, 0, 800, 500);
        this.temp--;
    }

    drawLine(startPos, endPos) {
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.strokeStyle = this.color;
        this.ctx.beginPath();
        this.ctx.moveTo(startPos.x, startPos.y);
        this.ctx.lineTo(endPos.x, endPos.y);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
        let that = this;
        socket.emit('drawLine', { startPos: startPos, endPos: endPos, lineWidth: that.lineWidth, color: that.color })
    }

    drawRect(startPos, endPos) {
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.strokeStyle = this.color;
        this.ctx.beginPath();
        this.ctx.rect(startPos.x, startPos.y,
            endPos.x - startPos.x, endPos.y - startPos.y);
        this.ctx.stroke();
        let that = this;
        socket.emit('drawRect', { startPos: startPos, endPos: endPos, lineWidth: that.lineWidth, color: that.color })
    }
}

var paint_nsp = io("/paint");
// paint_nsp.emit("join_room",room_id);
var p = new paint();