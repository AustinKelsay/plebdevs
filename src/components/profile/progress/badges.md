{
    "content":"",
    "created_at":1733852920,
    "id":"b0a72bef2d167359e46f29371c6fab353364aded30dd04778e9c66b3e58def46",
    "kind":30009,
    "pubkey":"62bad2c804210b9ccd8b3d6b49da7333185bae17c12b6d7a8ed5865642e82b1e",
    "sig":"6b481176a7208b6f8edc76de1bf90859d3fe97b8894f49ee1fd2471ccf3584fb990e7e8a2bba075e6c9867e351c092d262c3fb67997c8c983c4deaef82adba8e",
    "tags":[
        ["d","testr42069"],
        ["name","mario-test"],
        ["description","A test for mario, it's a' me."],
        ["image","https://plebdevs-bucket.nyc3.cdn.digitaloceanspaces.com/voltage-tipper.png","1024x1024"],
        ["thumb","https://plebdevs-bucket.nyc3.cdn.digitaloceanspaces.com/voltage-tipper.png","512x512"],
        ["thumb","https://plebdevs-bucket.nyc3.cdn.digitaloceanspaces.com/voltage-tipper.png","256x256"],
        ["thumb","https://plebdevs-bucket.nyc3.cdn.digitaloceanspaces.com/voltage-tipper.png","64x64"],
        ["thumb","https://plebdevs-bucket.nyc3.cdn.digitaloceanspaces.com/voltage-tipper.png","32x32"],
        ["thumb","https://plebdevs-bucket.nyc3.cdn.digitaloceanspaces.com/voltage-tipper.png","16x16"]
        ]
}

Key points for implementation:

Use a unique identifier in the d tag that includes the course level and year
Include high-res (1024x1024) badge images and multiple thumbnail sizes
Create Badge Award events (kind 8) to assign badges to students who complete courses
Students can then choose to display badges via Profile Badges events (kind 30008)