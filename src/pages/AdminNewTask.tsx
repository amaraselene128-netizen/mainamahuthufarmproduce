import NewTask from "./NewTask";

// Admin can post tasks from the admin panel. RLS allows hiring_id = auth.uid()
// and the admin policy also lets admins update/delete any task, so the same
// form is functionally identical for admins.
export default function AdminNewTask() {
  return (
    <div>
      <NewTask />
    </div>
  );
}
