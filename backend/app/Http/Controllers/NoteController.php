<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(Note::where('user_id', $request->user()->id)->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
        ]);

        $data['user_id'] = $request->user()->id;

        return response()->json(Note::create($data), 201);
    }

    public function show(Request $request, $id)
    {
        $note = Note::where('user_id', $request->user()->id)->findOrFail($id);
        return response()->json($note);
    }

    public function update(Request $request, $id)
    {
        $note = Note::where('user_id', $request->user()->id)->findOrFail($id);

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'content' => ['sometimes', 'nullable', 'string'],
        ]);

        $note->update($data);

        return response()->json($note);
    }

    public function destroy(Request $request, $id)
    {
        $note = Note::where('user_id', $request->user()->id)->findOrFail($id);
        $note->delete();

        return response()->json(['message' => 'Note deleted']);
    }
}
