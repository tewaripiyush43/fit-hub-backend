module.exports = {
    dummyPost: async (req, res) => {
        // console.log(req.headers);
        console.log(req.body);
        // res.status(200).json(req.body);
        res.status(200).send("Post Done")
    },

    dummyGet: async (req, res) => {
        // console.log(req.headers);
        console.log("GET /dummy called");
        // setInterval(() => {

        res.send("GET done");
        // }, 10000)
    },
    dummySlug: async (req, res) => {
        const slug = req.params.slug;
        res.send("GET on slug done")
    }
}