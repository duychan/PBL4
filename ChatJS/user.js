class User {

    constructor(name, gameCode, socket) {
        this.name = name
        this.gameCode = gameCode
        this.drawer = true
        this.score = 0
        this.socket = socket
    }

    isDrawe() {
        return this.drawer
    }

    setGuesser() {
        this.drawer = false
    }

    json() {
        return {
            'name': this.name,
            'gameCode': this.gameCode,
            'drawer': this.drawer,
            'score': this.score
        }
    }
}

module.exports = User;