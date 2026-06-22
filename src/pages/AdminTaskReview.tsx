import ReviewTask from "./ReviewTask";

// Reuses the hiring review UI for admins. RLS already allows admins to update
// task_submissions / task_applications via has_role.
export default function AdminTaskReview() {
  return <ReviewTask />;
}
