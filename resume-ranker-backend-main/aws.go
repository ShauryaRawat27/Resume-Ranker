package main

import (
	"context"
	"log"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var s3Client *s3.Client //S3CLIENT - An object that knows how to talk to AWS S3
var bucketName = "resume-ranker-uploads007"

func initS3(){ //PREPARES GO BACKEND TO TALK TO AWS SECURELY,ie, LOADS CEREDN,CREATES S3 CLIENT
	cfg, err := config.LoadDefaultConfig(context.TODO())

	if err != nil{
		log.Fatal("FAILED TO LOAD AWS CONFIG",err)
	}

	s3Client = s3.NewFromConfig(cfg)
	log.Println("S3 CLIENT INITIALIZED")
	

}