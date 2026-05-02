<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(Task::where('user_id', $request->user()->id)->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'completed' => ['boolean'],
            'due_date' => ['nullable', 'date'],
            'priority' => ['nullable', 'string', 'max:255'],
        ]);

        $data['user_id'] = $request->user()->id;
        $data['completed'] = $data['completed'] ?? false;

        return response()->json(Task::create($data), 201);
    }

    public function show(Request $request, $id)
    {
        $task = Task::where('user_id', $request->user()->id)->findOrFail($id);
        return response()->json($task);
    }

    public function update(Request $request, $id)
    {
        $task = Task::where('user_id', $request->user()->id)->findOrFail($id);

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'completed' => ['sometimes', 'boolean'],
            'due_date' => ['sometimes', 'nullable', 'date'],
            'priority' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $task->update($data);

        return response()->json($task);
    }

    public function destroy(Request $request, $id)
    {
        $task = Task::where('user_id', $request->user()->id)->findOrFail($id);
        $task->delete();
        return response()->json(['message' => 'Task deleted']);
    }
}
