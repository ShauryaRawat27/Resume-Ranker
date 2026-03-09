package models



type Criterion struct{
	ID string	`json:"id"`
	JobID string	`json:"job_id"`
	Name string		`json:"name"`
	Weight int		`json:"weight"`
	Synonyms []string	`json:"synonyms"`
}