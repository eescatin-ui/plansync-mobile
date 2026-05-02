<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScheduleClass extends Model
{
    use HasFactory;

    protected $table = 'schedule_classes';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'title',
        'location',
        'instructor',
        'day',
        'start_time',
        'end_time',
        'color',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
