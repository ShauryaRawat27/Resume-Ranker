package models

import "time"

type Job struct {
	ID          string	`json:"id"`
	Title       string	`json:"title"`
	Description string	`json:"description"`
	RecruiterID string	`json:"recruiter_id"`
	Status      string	`json:"status"`
	Deadline 	time.Time	`json:"deadline"`
	CreatedAt   time.Time	`json:"created_at"`
}