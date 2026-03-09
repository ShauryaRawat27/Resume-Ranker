package repository

import (
	"database/sql"
	"time"
)

type Job struct{
	ID          string
	Title       string
	Description string
	RecruiterID string
	Status      string
	Deadline    time.Time
	CreatedAt   time.Time	
}
//we are doing this to eliminate global db var so that no random function uses the db
type JobRepository struct{
	DB *sql.DB //pointer to a db conncn
}
//JobRepository is a struct that contains a database connection.

func NewJobRepository(db *sql.DB) *JobRepository{
	return &JobRepository{DB : db}
}
//constructor function 
//basically creating an object
//it recvs a db connc and returns JobRepositopry object

//The following is happening
//repo := JobRepository{}
//repo.DB = db
//return &repo

func (r *JobRepository) GetAll() ([]Job,error){
	rows, err := r.DB.Query(`
		SELECT id, title, description, recruiter_id, status, deadline, created_at
		FROM jobs`)
	if err != nil {
		return nil, err
	}
	defer rows.Close() //happens when the whole function comes to an end

	var jobs []Job
	for rows.Next() {
		var job Job
		err := rows.Scan(
			&job.ID,
			&job.Title,
			&job.Description,
			&job.RecruiterID,
			&job.Status,
			&job.Deadline,
			&job.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		jobs = append(jobs, job)
	}

	return jobs,nil
}

func (r *JobRepository) GetByRecruiter(recruiterID string) ([]Job,error){
	rows, err := r.DB.Query(`
		SELECT id, title, description, recruiter_id, status, deadline, created_at
		FROM jobs where recruiter_id = $1`,recruiterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close() 

	var jobs []Job
	for rows.Next() {
		var job Job
		err := rows.Scan(
			&job.ID,
			&job.Title,
			&job.Description,
			&job.RecruiterID,
			&job.Status,
			&job.Deadline,
			&job.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		jobs = append(jobs, job)
	}

	return jobs,nil
}

func (r *JobRepository) Create(job Job) error {
	_, err := r.DB.Exec(`
		INSERT INTO jobs (id, title, description, recruiter_id, status, deadline, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
	`,
		job.ID,
		job.Title,
		job.Description,
		job.RecruiterID,
		job.Status,
		job.Deadline,
		job.CreatedAt,
	)
	return err
}