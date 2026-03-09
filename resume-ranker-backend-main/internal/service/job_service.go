package service

import(
	"time"

	"github.com/google/uuid"
	"resume-ranker/internal/repository"	
)

type JobService struct{
	Repo *repository.JobRepository
}

func NewJobService(repo *repository.JobRepository) *JobService {
	return &JobService{Repo:repo}
}

func (s *JobService) GetJobs(userID, role string) ([]repository.Job,error){
	if role == "recruiter"{
		return s.Repo.GetByRecruiter(userID)
	}

	return s.Repo.GetAll()
}
//we pass the repo to the struct

//JobService
//    └── Repo → JobRepository
//                └── DB → database



//s *jobService reciever - func works on jobservice
func (s *JobService) CreateJob(
	title, description, recruiterID, status string,
	deadline time.Time,
) (repository.Job, error) {

	job := repository.Job{
		ID:          uuid.NewString(),
		Title:       title,
		Description: description,
		RecruiterID: recruiterID,
		Status:      status,
		Deadline:    deadline,
		CreatedAt:   time.Now(),
	}

	err := s.Repo.Create(job)
	if err != nil {
		return repository.Job{}, err
	}

	return job, nil
}