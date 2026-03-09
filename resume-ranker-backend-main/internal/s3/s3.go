package s3

import (
	"context"
	"log"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Client struct {
	S3     *s3.Client
	Bucket string
}

func Init() *Client {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Fatal("FAILED TO LOAD AWS CONFIG:", err)
	}

	s3Client := s3.NewFromConfig(cfg)

	log.Println("S3 CLIENT INITIALIZED")

	return &Client{
		S3:     s3Client,
		Bucket: "resume-ranker-uploads007",
	}
}

//s3client is basically a bridge between your backend and aws