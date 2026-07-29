<?php

namespace App\Service;

use App\Entity\Slave\Practice;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Salvataggio/lettura dei file allegati alle pratiche (practices).
 * I file vivono fuori dalla webroot: var/uploads/practices/{dbName}/{practiceId}/...
 * `storagePath` sul Documento è relativo alla base del tenant ({dbName}).
 */
class DocumentStorage
{
    public function __construct(private readonly ParameterBagInterface $params)
    {
    }

    /** Base assoluta di tutti gli upload pratiche. */
    private function root(): string
    {
        return rtrim((string) $this->params->get('kernel.project_dir'), '/\\') . '/var/uploads/practices';
    }

    /** Base assoluta del tenant (agenzia). */
    public function tenantDir(string $dbName): string
    {
        return $this->root() . '/' . $dbName;
    }

    /** Percorso assoluto di un file a partire dal suo storagePath relativo. */
    public function absolutePath(string $dbName, string $relativePath): string
    {
        return $this->tenantDir($dbName) . '/' . ltrim($relativePath, '/\\');
    }

    /**
     * Salva l'UploadedFile per la pratica. Ritorna i metadati da persistere sul Documento.
     *
     * @return array{path: string, name: string, mime: string, size: int}
     */
    public function store(string $dbName, Practice $practice, UploadedFile $file): array
    {
        $original = $file->getClientOriginalName();
        $safe = preg_replace('/[^a-zA-Z0-9._-]+/', '_', strtolower($original)) ?: 'allegato';
        $relative = $practice->getId() . '/' . bin2hex(random_bytes(8)) . '_' . $safe;
        $absDir = $this->tenantDir($dbName) . '/' . $practice->getId();
        if (!is_dir($absDir) && !@mkdir($absDir, 0775, true) && !is_dir($absDir)) {
            throw new \RuntimeException('Impossibile creare la cartella di destinazione.');
        }

        $file->move($absDir, basename($relative));

        return [
            'path' => $relative,
            'name' => $original,
            'mime' => $file->getClientMimeType() ?: 'application/octet-stream',
            'size' => (int) @filesize($this->absolutePath($dbName, $relative)),
        ];
    }

    /** Elimina fisicamente il file (best effort). */
    public function delete(string $dbName, ?string $relativePath): void
    {
        if ($relativePath === null || $relativePath === '') {
            return;
        }
        $abs = $this->absolutePath($dbName, $relativePath);
        if (is_file($abs)) {
            @unlink($abs);
        }
    }
}
