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

    /** Estensione e MIME ammessi per gli allegati: per ora solo PDF. */
    public const ALLOWED_EXTENSION = 'pdf';
    public const ALLOWED_MIME = 'application/pdf';

    /**
     * Controlla che l'allegato sia un PDF valido. Ritorna il messaggio d'errore da
     * mostrare, oppure null se il file va bene.
     *
     * Il MIME viene dedotto dal contenuto ({@see UploadedFile::getMimeType()}), non da
     * quello dichiarato dal browser: un file rinominato in .pdf viene scartato.
     */
    public function validationError(?UploadedFile $file): ?string
    {
        if ($file === null) {
            return 'Seleziona un file da caricare.';
        }
        if (!$file->isValid()) {
            return 'Caricamento non riuscito: ' . $file->getErrorMessage();
        }
        if (strtolower((string) $file->getClientOriginalExtension()) !== self::ALLOWED_EXTENSION) {
            return 'Sono ammessi solo file PDF.';
        }

        try {
            $mime = (string) $file->getMimeType();
        } catch (\Throwable) {
            $mime = '';
        }
        if ($mime !== self::ALLOWED_MIME) {
            return 'Il file non è un PDF valido' . ($mime !== '' ? ' (rilevato: ' . $mime . ')' : '') . '.';
        }

        return null;
    }

    /**
     * Salva l'UploadedFile per la pratica. Ritorna i metadati da persistere sul Documento.
     *
     * $displayName: nome scelto a mano per l'allegato. Se valorizzato il file NON conserva
     * il nome originale: prende questo nome più l'estensione del file caricato (pdf se
     * il file non ne ha una). È il nome mostrato nelle liste e usato nel download.
     *
     * @return array{path: string, name: string, mime: string, size: int}
     */
    public function store(string $dbName, Practice $practice, UploadedFile $file, ?string $displayName = null): array
    {
        $original = $this->fileName($file, $displayName);
        $safe = preg_replace('/[^a-zA-Z0-9._-]+/', '_', strtolower($original)) ?: 'allegato';
        $relative = $practice->getId() . '/' . bin2hex(random_bytes(8)) . '_' . $safe;
        $absDir = $this->tenantDir($dbName) . '/' . $practice->getId();
        if (!is_dir($absDir) && !@mkdir($absDir, 0775, true) && !is_dir($absDir)) {
            throw new \RuntimeException('Impossibile creare la cartella di destinazione.');
        }

        // Il MIME va letto prima dello spostamento, e dal contenuto: quello dichiarato
        // dal browser è manipolabile.
        try {
            $mime = (string) $file->getMimeType();
        } catch (\Throwable) {
            $mime = (string) $file->getClientMimeType();
        }

        $file->move($absDir, basename($relative));

        return [
            'path' => $relative,
            'name' => $original,
            'mime' => $mime ?: 'application/octet-stream',
            'size' => (int) @filesize($this->absolutePath($dbName, $relative)),
        ];
    }

    /**
     * Nome del file da conservare: quello scelto nel form (più l'estensione del file
     * caricato), altrimenti il nome originale così come arriva dal browser.
     */
    private function fileName(UploadedFile $file, ?string $displayName): string
    {
        $original = (string) $file->getClientOriginalName();
        $displayName = trim((string) $displayName);
        if ($displayName === '') {
            return $original !== '' ? $original : 'allegato';
        }

        $extension = strtolower(pathinfo($original, PATHINFO_EXTENSION));
        if ($extension === '') {
            $extension = strtolower((string) $file->guessExtension()) ?: 'pdf';
        }

        // Se il nome scelto già finisce con l'estensione giusta non la raddoppiamo.
        if (str_ends_with(mb_strtolower($displayName), '.' . $extension)) {
            return $displayName;
        }

        return $displayName . '.' . $extension;
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
