<?php

namespace App\Http\Controllers;

use App\Models\ScheduleClass;
use Illuminate\Http\Request;

class ScheduleClassController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(ScheduleClass::where('user_id', $request->user()->id)->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'instructor' => ['nullable', 'string', 'max:255'],
            'day' => ['required', 'string', 'max:32'],
            'start_time' => ['required', 'string', 'max:32'],
            'end_time' => ['required', 'string', 'max:32'],
            'color' => ['nullable', 'string', 'max:32'],
        ]);

        $data['user_id'] = $request->user()->id;

        return response()->json(ScheduleClass::create($data), 201);
    }

    public function show(Request $request, $id)
    {
        $scheduleClass = ScheduleClass::where('user_id', $request->user()->id)->findOrFail($id);
        return response()->json($scheduleClass);
    }

    public function update(Request $request, $id)
    {
        $scheduleClass = ScheduleClass::where('user_id', $request->user()->id)->findOrFail($id);

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'instructor' => ['sometimes', 'nullable', 'string', 'max:255'],
            'day' => ['sometimes', 'required', 'string', 'max:32'],
            'start_time' => ['sometimes', 'required', 'string', 'max:32'],
            'end_time' => ['sometimes', 'required', 'string', 'max:32'],
            'color' => ['sometimes', 'nullable', 'string', 'max:32'],
        ]);

        $scheduleClass->update($data);

        return response()->json($scheduleClass);
    }

    public function destroy(Request $request, $id)
    {
        $scheduleClass = ScheduleClass::where('user_id', $request->user()->id)->findOrFail($id);
        $scheduleClass->delete();

        return response()->json(['message' => 'Class deleted']);
    }
}
