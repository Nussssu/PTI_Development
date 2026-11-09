<?php

namespace App\Models\Concerns;

use App\Support\Media;

/**
 * Adds a "<field>_url" key to the serialized model for every column in $mediaFields.
 */
trait HasMediaUrls
{
    public function attributesToArray()
    {
        $attributes = parent::attributesToArray();
        foreach ($this->mediaFields ?? [] as $field) {
            $attributes[$field.'_url'] = Media::url($this->attributes[$field] ?? null);
        }

        return $attributes;
    }
}
