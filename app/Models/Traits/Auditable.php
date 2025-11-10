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
            $description = self::generateDescription($model, 'Created');
            AuditLogService::logCreated(
                class_basename($model),
                $model->id,
                $description,
                $model->toArray()
            );
        });

        static::updated(function ($model) {
            $description = self::generateDescription($model, 'Updated');
            AuditLogService::logUpdated(
                class_basename($model),
                $model->id,
                $description,
                $model->getOriginal(),
                $model->getChanges()
            );
        });

        static::deleted(function ($model) {
            $description = self::generateDescription($model, 'Deleted');
            AuditLogService::logDeleted(
                class_basename($model),
                $model->id,
                $description,
                $model->toArray()
            );
        });
    }

    /**
     * Generate a meaningful description for audit logs
     */
    private static function generateDescription($model, $action)
    {
        $modelName = class_basename($model);
        
        switch ($modelName) {
            case 'Patient':
                $name = $model->child_name ?? 'Unknown';
                $regNo = $model->registration_no ?? '';
                return "{$action} patient: {$name}" . ($regNo ? " (Registration: {$regNo})" : '');
                
            case 'PatientInformation':
                $name = $model->full_name ?? 'Unknown';
                return "{$action} patient: {$name}";
                
            case 'PatientMedicalRecords':
                $patientId = $model->patient_id ?? 'Unknown';
                return "{$action} medical record for patient ID: {$patientId}";
                
            case 'User':
                $name = $model->name ?? $model->full_name ?? 'Unknown';
                return "{$action} user: {$name}";
                
            case 'FamilyPlanningClient':
                $name = $model->client_name ?? 'Unknown';
                return "{$action} family planning client: {$name}";
                
            case 'NewbornImmunization':
                $name = $model->child_name ?? 'Unknown';
                return "{$action} newborn immunization record: {$name}";
                
            case 'Nutrition12Months':
                $name = $model->child_name ?? 'Unknown';
                return "{$action} nutrition record: {$name}";
                
            case 'Outcome':
                $name = $model->child_name ?? 'Unknown';
                return "{$action} outcome record: {$name}";
                
            case 'VaccineList':
                $name = $model->product ?? 'Unknown';
                return "{$action} vaccine: {$name}";
                
            case 'ContraceptiveList':
                $name = $model->contraceptive_name ?? 'Unknown';
                return "{$action} contraceptive: {$name}";
                
            case 'ContraceptiveInventory':
                $name = $model->contraceptive_name ?? 'Unknown';
                return "{$action} contraceptive inventory: {$name}";
                
            default:
                return "{$action} {$modelName} record";
        }
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