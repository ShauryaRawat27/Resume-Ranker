package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"resume-ranker/internal/repository"

	"resume-ranker/internal/s3"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsS3 "github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type ApplicationService struct{
	Repo *repository.ApplicationRepository
	S3Client *s3.Client
}

func NewApplicationService(repo *repository.ApplicationRepository, s3Client *s3.Client,) *ApplicationService{
	return &ApplicationService{
		Repo: repo,
		S3Client: s3Client,
	}
}

func (s *ApplicationService) Apply(jobID, candidateID, role string) error{

	if role!="candidate" {
		return errors.New("ONLY CANDIDATES CAN APPLY")
	}

	appID := uuid.New().String()

	return s.Repo.Create(appID, jobID, candidateID, "resume_pending")
} 

func (s *ApplicationService) GetApplications(userID, role string) ([]repository.Application, error){

	if role == "candidate"{
		return s.Repo.GetByCandidate(userID)
	}

	if role == "recruiter" {
		return s.Repo.GetByRecruiter(userID)
	}

	return nil, errors.New("INVALID ROLE")
}

func (s *ApplicationService) PresignResumeUpload(ctx context.Context,applicationID, candidateID string)(string, string , error){
	_, err := s.Repo.GetResumeByCandidate(applicationID, candidateID)

	if err != nil{
		return "", "", errors.New("APPLICATION NOT FOUND")
	}

	s3Key := fmt.Sprintf("resumes/%s/resume.pdf", applicationID)

	presigner := awsS3.NewPresignClient(s.S3Client.S3)
//Basically a tool that generates signed URLs
	
	req, err := presigner.PresignPutObject(
		context.TODO(),
		&awsS3.PutObjectInput{
			Bucket:      &s.S3Client.Bucket,
			Key:         &s3Key,
			ContentType: aws.String("application/pdf"),
		},
		awsS3.WithPresignExpires(10*time.Minute),
	)
//context is a way to control and carry information across function boundaries.
	if err!=nil{
		return "","", err
	}

	return req.URL, s3Key, nil

}

func (s *ApplicationService) ConfirmResumeUpload(ctx context.Context, applicationID, candidateID string) error{
	s3Key := fmt.Sprintf("resumes/%s/resume.pdf",applicationID)

	_, err := s.S3Client.S3.HeadObject(ctx, &awsS3.HeadObjectInput{
		Bucket: &s.S3Client.Bucket,
		Key: &s3Key,
	})
	//CHECK INSIDE THIS BUCKET IF THIS KEY EXISTS

	if err!=nil{
		return errors.New("FILE NOT FOUND IN S3")
	}

	return s.Repo.ConfirmResumeUpload(applicationID,candidateID,s3Key)
}

func (s *ApplicationService) GenerateResumeDownloadURL(ctx context.Context, applicationID string, recruiterID string) (string ,error){
	//retrieving s3 key if recruiter owns the job
	
	s3Key, err := s.Repo.GetResumeForRecruiter(applicationID,recruiterID)
	if err!=nil{
		return "", errors.New("NOT AUHTORIZED OR RESUME NOT FOUND")
	}

	presigner := awsS3.NewPresignClient(s.S3Client.S3)

	req, err := presigner.PresignGetObject(
		ctx,
		&awsS3.GetObjectInput{
			Bucket: aws.String(s.S3Client.Bucket),
			Key: aws.String(s3Key),
		},
		awsS3.WithPresignExpires(10*time.Minute),
	)

	if err != nil{
		return "", err
	}

	return req.URL, nil
}

func (s *ApplicationService) SaveResumeText(applicationID, candidateID, role, resumeText string) error{
	if role != "candidate"{
		return errors.New("ONLY CANDIDATES CAN SAVE RESUME TEXT!!!");
	}

	if strings.TrimSpace(resumeText) == ""{
		return errors.New("RESUME TEXT IS REQUIRED!!!")
	}

	return s.Repo.SaveResumeText(applicationID, candidateID, resumeText)
}
