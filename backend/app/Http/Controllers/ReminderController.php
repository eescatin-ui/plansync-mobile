<?php

namespace App\Http\Controllers;

use App\Models\Reminder;
use Illuminate\Http\Request;

class ReminderController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(Reminder::where('user_id', $request->user()->id)->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string'],
            'remind_at' => ['required', 'date'],
            'completed' => ['boolean'],
        ]);

        $data['user_id'] = $request->user()->id;
        $data['completed'] = $data['completed'] ?? false;

        return response()->json(Reminder::create($data), 201);
    }

    public function show(Request $request, $id)
    {
        $reminder = Reminder::where('user_id', $request->user()->id)->findOrFail($id);
        return response()->json($reminder);
    }

    public function update(Request $request, $id)
    {
        $reminder = Reminder::where('user_id', $request->user()->id)->findOrFail($id);

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'note' => ['sometimes', 'nullable', 'string'],
            'remind_at' => ['sometimes', 'nullable', 'date'],
            'completed' => ['sometimes', 'boolean'],
        ]);

        $reminder->update($data);

        return response()->json($reminder);
    }

    public function destroy(Request $request, $id)
    {
        $reminder = Reminder::where('user_id', $request->user()->id)->findOrFail($id);
        $reminder->delete();

        return response()->json(['message' => 'Reminder deleted']);
    }
}
