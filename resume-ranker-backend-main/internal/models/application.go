package models

import "time"

type Application struct {
	ID          string    `json:"id"`
	JobID       string    `json:"job_id"`
	CandidateID string    `json:"candidate_id"`
	ResumeURL   *string   `json:"resume_url,omitempty"`
	Status      string    `json:"status"`
	AppliedAt   time.Time `json:"applied_at"`
	ResumeText *string `json:"resume_text,omitempty"`
}