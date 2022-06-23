    var AWS = require('aws-sdk');

    var s3 = new AWS.S3({apiVersion: '2006-03-01', signatureVersion: 'v4', region: 'ap-northeast-2'});

    var presignedPUTURL = s3.getSignedUrl('putObject', {
        Bucket: "sprint-photo",
        Key: "images1.jpeg", 
        Expires: 600 
    });

    console.log(presignedPUTURL);
