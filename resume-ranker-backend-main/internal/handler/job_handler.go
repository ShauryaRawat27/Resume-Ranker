package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"resume-ranker/internal/service"
)


type JobHandler struct{
	Service *service.JobService
}

func NewJobHandler(service *service.JobService) *JobHandler {
	return &JobHandler{Service: service}
}

func (h *JobHandler) GetJobs(w http.ResponseWriter, r *http.Request) {

	userID, ok:= r.Context().Value("user_id").(string)

	if!ok{
		http.Error(w,"UNAUTHORIZED",http.StatusUnauthorized)
		return
	}

	role, ok := r.Context().Value("role").(string)

	if !ok{
		http.Error(w, "UNAUTHORIZED", http.StatusUnauthorized)
		return
	}
	jobs, err := h.Service.GetJobs(userID,role)
	if err != nil {
		http.Error(w, "FAILED TO FETCH JOBS", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(jobs)
}

func (h *JobHandler) CreateJob(w http.ResponseWriter, r *http.Request) {

userID, ok := r.Context().Value("user_id").(string)
if !ok {
	http.Error(w, "UNAUTHORIZED", http.StatusUnauthorized)
	return
}

role, ok := r.Context().Value("role").(string)
if !ok {
	http.Error(w, "UNAUTHORIZED", http.StatusUnauthorized)
	return
}

if role != "recruiter"{
	http.Error(w,"FORBIDDEN RECRUITERS ONLY",http.StatusForbidden)
	return
}
	var input struct {
		Title       string    `json:"title"`
		Description string    `json:"description"`
		Status      string    `json:"status"`
		Deadline    time.Time `json:"deadline"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "INVALID INPUT", http.StatusBadRequest)
		return
	}

	job, err := h.Service.CreateJob(
		input.Title,
		input.Description,
		userID, 
		input.Status,
		input.Deadline,
	)

	if err != nil {
		http.Error(w, "FAILED TO CREATE JOB", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(job)
}