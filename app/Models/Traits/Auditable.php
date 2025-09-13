<?php

namespace App\Models\Traits;

use App\Services\AuditLogService;

trait Auditable
{
    /**
     * Boot the trait
     */
    protected static function bootAuditable()
    {
        static::created(function ($model) {
            AuditLogService::logCreated(
                class_basename($model),
                $model->id,
                null,
                $model->toArray()
            );
        });

        static::updated(function ($model) {
            AuditLogService::logUpdated(
                class_basename($model),
                $model->id,
                null,
                $model->getOriginal(),
                $model->getChanges()
            );
        });

        static::deleted(function ($model) {
            AuditLogService::logDeleted(
                class_basename($model),
                $model->id,
                null,
                $model->toArray()
            );
        });
    }

    /**
     * Log a custom action for this model
     */
    public function logAction(string $action, ?string $description = null, ?array $additionalData = null)
    {
        return AuditLogService::log(
            $action,
            class_basename($this),
            $this->id,
            $description,
            null,
            $additionalData
        );
    }

    /**
     * Log a view action for this model
     */
    public function logViewed(?string $description = null)
    {
        return AuditLogService::logViewed(
            class_basename($this),
            $this->id,
            $description
        );
    }
} 