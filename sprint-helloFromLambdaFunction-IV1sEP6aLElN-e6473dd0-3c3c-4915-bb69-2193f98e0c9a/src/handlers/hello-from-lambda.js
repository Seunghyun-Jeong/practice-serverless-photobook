var AWS = require("aws-sdk");
var sharp = require("sharp");
const axios = require("axios");

exports.helloFromLambdaHandler = async (event, context) => {
    console.log(event.Records[0].s3)

    const eventBody = JSON.parse(event.Records[0].body)
    const objectKey = eventBody.Records[0].s3.object.key
    const originBucket = eventBody.Records[0].s3.bucket.name
    // const originBucket = event.Records[0].s3.bucket.name
    // const objectKey = event.Records[0].s3.object.key

    console.log(context)

    var s3 = new AWS.S3({apiVersion: '2006-03-01'});

    // 원본 버킷으로부터 파일 읽기
    const s3Object = await s3.getObject({
        Bucket: `${originBucket}`,
        Key: `${objectKey}`
    }).promise()
    
    // 이미지 리사이즈, sharp 라이브러리가 필요합니다.
    const data = await sharp(s3Object.Body)
        .resize(200)
        .jpeg({ mozjpeg: true })
        .toBuffer()
    
    // 대상 버킷으로 파일 쓰기
    const result = await s3.putObject({
        Bucket: `${process.env.TGBUCKET}`, 
        Key: `${objectKey}`,
        ContentType: 'image/jpeg',
        Body: data,
        ACL: 'public-read'
    }).promise()
    
    var sns = new AWS.SNS({apiVersion: '2010-03-31'});
    console.log(process.env.URL)
    console.log(objectKey)
    var params = {
        Message: `ImageURL : ${process.env.URL}/${objectKey}`,
        Subject: "Notice!",
        TopicArn: "arn:aws:sns:ap-northeast-2:264932596642:sprintSNS"
    }
    var snsPromise = await sns.publish(params).promise();

    try {
        const result = await axios.post(`${process.env.WEBHOOK}`, {
            "content": "테스트",
            "username": 'Secret',
            "embeds" : [{
                "image": {
                    "url" : `${process.env.URL}/${objectKey}`
                }
            }]
        });
        console.info("웹훅 성공")
    }
    catch(err){
        console.err("웹훅 실패", err)
    }

    return 'Hello from Lambda!';
}