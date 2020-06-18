const test = require("tape")
const { Autoswarm } = require("./index.js")
const { debounce } = require("debounce")

test('update-and-retrieve', (t) => {
    t.plan(1)
    const s = new Autoswarm('mycoolnewtopic')
    s.change((doc) => {
        doc.new_property = 1
    })
    t.equal(s.get().new_property, 1)
    s.close()
})

test('two-node', async (t) => {
    t.plan(1)
    const sender = new Autoswarm('mycoolnewtopic9')
    const receiver = new Autoswarm('mycoolnewtopic9')

    await new Promise((resolve) => {
        const check = debounce(() => {
            let doc = receiver.get()
            t.equal(doc.new_property, 2)
            sender.close()
            receiver.close()
            resolve()
        }, 200)
        receiver.on('data', (data) => {
            check()
        })
        sender.change((doc) => {
            doc.new_property = 2
        })
    })
})

test('serialization', (t) => {
    t.plan(2)

    const swarm = new Autoswarm('demome');
    swarm.change(doc => {
        doc.a = 1
        doc.b = 2
        doc.c = 3
    })
    swarm.change(doc => {
        doc.a = 4
    })

    const doc = swarm.get()
    const saveData = swarm.save()
    swarm.change(doc => {
        doc.ock = 'liv'
    })
    swarm.load(saveData)
    const loadedDoc = swarm.get()
    t.deepEqual(doc, loadedDoc, "loading save data restores state")
    const newSave = swarm.save()
    t.equal(saveData, newSave, "save data is the same after loading")

    swarm.close()
})