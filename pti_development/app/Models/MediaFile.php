<?php

namespace App\Models;

use App\Support\Media;
use Illuminate\Database\Eloquent\Model;

/** An image or video in the admin media library (files live on the "public" disk). */
class MediaFile extends Model
{
    use \App\Models\Concerns\Auditable;

    protected string $auditAs = 'media file';

    protected $table = 'media';

    protected $guarded = ['id'];

    protected $appends = ['url'];

    public function getUrlAttribute(): ?string
    {
        return Media::url($this->path);
    }
}
