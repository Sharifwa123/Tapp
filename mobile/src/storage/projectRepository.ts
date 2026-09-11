// mobile/src/storage/projectRepository.ts
import { getDatabase } from "./database";
import type { Project } from "./types";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createProject(name: string): Promise<Project> {
  const db = await getDatabase();
  const now = Date.now();
  const project: Project = { id: generateId(), name, createdAt: now, updatedAt: now };

  await db.runAsync(
    "INSERT INTO projects (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)",
    project.id,
    project.name,
    project.createdAt,
    project.updatedAt
  );

  return project;
}

export async function getAllProjects(): Promise<Project[]> {
  const db = await getDatabase();
  return db.getAllAsync<Project>("SELECT * FROM projects ORDER BY updatedAt DESC");
}

export async function getProject(id: string): Promise<Project | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Project>("SELECT * FROM projects WHERE id = ?", id);
  return row ?? null;
}

export async function renameProject(id: string, name: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE projects SET name = ?, updatedAt = ? WHERE id = ?", name, Date.now(), id);
}

export async function touchProject(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE projects SET updatedAt = ? WHERE id = ?", Date.now(), id);
}

// Deleting a project cascades to media_items, transcripts, translations,
// summaries, and exports via the foreign key ON DELETE CASCADE clauses —
// but the caller is responsible for deleting the actual files on disk
// first (see mediaRepository.deleteMediaFiles), since SQLite has no idea
// those files exist.
export async function deleteProject(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM projects WHERE id = ?", id);
}

export async function searchProjects(query: string): Promise<Project[]> {
  const db = await getDatabase();
  const like = `%${query}%`;
  return db.getAllAsync<Project>(
    "SELECT * FROM projects WHERE name LIKE ? ORDER BY updatedAt DESC",
    like
  );
}
