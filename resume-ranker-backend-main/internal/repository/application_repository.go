package repository

import (
	"database/sql"
	"errors"
	"time"
)

type Application struct{
	ID          string
	JobID       string
	CandidateID string
	AppliedAt	time.Time
	ResumeUrl	string
	Status      string
}




type ApplicationRepository struct{
	DB *sql.DB
}

func NewApplicationRepository(db *sql.DB) * ApplicationRepository{
	return &ApplicationRepository{DB:db}
}

func (r *ApplicationRepository) Create(appID,jobID,candidateID,status string) error{
	_, err := r.DB.Exec(`
		INSERT INTO applications (id, job_id, candidate_id, status, applied_at)
		VALUES ($1, $2, $3, $4, NOW())
	`, appID, jobID, candidateID, status)

	return err
}

func (r *ApplicationRepository) GetByCandidate(candidateID string) ([]Application, error){
	rows, err := r.DB.Query(`
		SELECT id, job_id, candidate_id, applied_at, resume_url, status
		FROM applications
		WHERE candidate_id = $1
	`, candidateID)

	if err != nil{
		return nil,err
	}
	defer rows.Close()

	var applications []Application

	for rows.Next() {
		var application Application

		err := rows.Scan(
			&application.ID,
			&application.JobID,
			&application.CandidateID,
			&application.AppliedAt,
			&application.ResumeUrl,
			&application.Status,
		)

		if err != nil {
			return nil, err
		}
		applications = append(applications,application) 
	}
	return applications,nil
}

func (r *ApplicationRepository) GetByRecruiter(recruiterID string) ([]Application, error){
	rows, err := r.DB.Query(`
		SELECT a.id, a.job_id, a.candidate_id, a.applied_at, a.resume_url, a.status
		FROM applications a
		JOIN jobs j ON a.job_id = j.id
		WHERE j.recruiter_id = $1
	`, recruiterID)

	if err != nil{
		return nil,err
	}

	defer rows.Close()

	var applications []Application

	for rows.Next() {
		var application Application

		err := rows.Scan(
			&application.ID,
			&application.JobID,
			&application.CandidateID,
			&application.AppliedAt,
			&application.ResumeUrl,
			&application.Status,
		)

		if err!= nil{
			return nil, err
		}
		applications = append(applications,application)
	}

	return applications,nil

}

func (r *ApplicationRepository) GetResumeByCandidate(applicationID, candidateID string) (sql.NullString, error){

	var resume sql.NullString

	err := r.DB.QueryRow(`
		SELECT resume_url
		FROM applications
		WHERE id = $1 AND candidate_id = $2
	`, applicationID, candidateID).Scan(&resume)

	return resume, err
}

func (r *ApplicationRepository) ConfirmResumeUpload(applicationID, candidateID, s3Key string) error {

	res, err := r.DB.Exec(`
		UPDATE applications
		SET resume_url = $1,
		    status = 'resume_uploaded'
		WHERE id = $2 AND candidate_id = $3
	`, s3Key, applicationID, candidateID)

	if err != nil {
		return err
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		return errors.New("application not found")
	}

	return nil
}

func (r *ApplicationRepository) GetResumeForRecruiter(applicationID, recruiterID string) (string, error) {

	var s3Key string

	err := r.DB.QueryRow(`
		SELECT a.resume_url
		FROM applications a
		JOIN jobs j ON a.job_id = j.id
		WHERE a.id = $1 AND j.recruiter_id = $2
	`, applicationID, recruiterID).Scan(&s3Key)

	return s3Key, err
}