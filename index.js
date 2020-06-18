const Automerge = require('automerge')

const hyperswarm = require('hyperswarm')
const crypto = require('crypto')
const lpstream = require('length-prefixed-stream')

class Autoswarm {

    constructor(topicName, options) {
        let init = {}
        let swarmOpts = { ...options }

        // State
        this.docName = 'default'
        this.swarm = hyperswarm(swarmOpts)
        this.docSet = new Automerge.DocSet()
        this._on = {}

        this.docSet.setDoc(this.docName, Automerge.from(init))

        // HACK: Add a dummy change to force synchronization
        this.change(doc => doc._ = null)
        this.change(doc => delete doc._)

        // Set up Automerge listeners
        this.docSet.registerHandler((docId, doc) => {
            this._ifOn('change', docId, doc)
        })

        // look for peers listed under this topic
        const topic = crypto.createHash('sha256')
            .update(topicName)
            .digest()

        // Hyperswarm listeners
        this.swarm.join(topic, {
            lookup: true, // find & connect to peers
            announce: true, // optional- announce self as a connection target
        })

        // On a new connection to a peer, set up 2-way automatic syncing
        this.swarm.on('connection', (socket, details) => {
            const encoder = lpstream.encode()
            const decoder = lpstream.decode()
            encoder.pipe(socket)
            socket.pipe(decoder)
            const sendMsg = msg => {
                encoder.write(JSON.stringify(msg))
            }
            const connection = new Automerge.Connection(this.docSet, sendMsg)

            // Receiving data from the network
            decoder.on('data', (data) => {
                data = JSON.parse(Buffer.from(data, 'utf8'))
                connection.receiveMsg(data)
                this._ifOn('data', data)
            })

            socket.on('close', (data) => {
                connection.close()
                this._ifOn('close', data)
            })

            socket.on('error', (err) => {
                this._ifOn('error', err)
            })

            connection.open()
            this._ifOn('connection', socket, details)
        })
    }

    _ifOn(eventName, ...args) {
        if (this._on[eventName]) {
            this._on[eventName](...args)
        }
    }

    on(eventName, callback) {
        this._on[eventName] = callback
    }

    get() {
        return this.docSet.getDoc(this.docName)
    }

    change(changeFn) {
        let doc = this.docSet.getDoc(this.docName)
        doc = Automerge.change(doc, changeFn)
        this.docSet.setDoc(this.docName, doc)
    }

    save() {
        return Automerge.save(this.get())
    }

    load(data) {
        this.docSet.setDoc(this.docName, Automerge.load(data))
    }

    close() {
        this.swarm.destroy()
    }
}


module.exports = {
    Autoswarm
}