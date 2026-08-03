<?php

namespace App\Entity\Slave;

use App\Entity\Trait\IdTrait;
use App\Entity\Trait\TimestampsTrait;
use App\Repository\Slave\DocumentRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * 17.1.1.1.5.2 Documento/allegato di una pratica.
 * Può esistere come "richiesto" senza file, oppure con file caricato.
 */
#[ORM\Entity(repositoryClass: DocumentRepository::class)]
#[ORM\Table(name: 'eb_s_document')]
#[ORM\HasLifecycleCallbacks]
class Document
{
    use IdTrait;
    use TimestampsTrait;

    // 17.1.1.1.5.2.5 Stato di verifica.
    public const STATUS_DA_VERIFICARE = 'da_verificare';
    public const STATUS_VERIFICATO = 'verificato';

    #[ORM\ManyToOne(targetEntity: Practice::class, inversedBy: 'documents')]
    #[ORM\JoinColumn(name: 'practice_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Practice $practice = null;

    /**
     * 13.1 Tipo di documento del catalogo dell'agenzia da cui nasce questo allegato.
     * Nullable: restano validi i documenti aggiunti a mano, fuori catalogo. Il vincolo
     * RESTRICT è ciò che rende un tipo "già utilizzato" e quindi non eliminabile (13.1.5).
     */
    #[ORM\ManyToOne(targetEntity: DocumentType::class)]
    #[ORM\JoinColumn(name: 'document_type_id', referencedColumnName: 'id', nullable: true, onDelete: 'RESTRICT')]
    private ?DocumentType $documentType = null;

    /** 17.1.1.1.5.2.1 Nome allegato. */
    #[ORM\Column(type: 'string', length: 190)]
    private string $name = '';

    /** Nome file originale caricato. */
    #[ORM\Column(name: 'original_filename', type: 'string', length: 255, nullable: true)]
    private ?string $originalFilename = null;

    /** Percorso relativo del file salvato (null = documento richiesto ma non ancora caricato). */
    #[ORM\Column(name: 'storage_path', type: 'string', length: 255, nullable: true)]
    private ?string $storagePath = null;

    #[ORM\Column(name: 'mime_type', type: 'string', length: 120, nullable: true)]
    private ?string $mimeType = null;

    #[ORM\Column(name: 'size_bytes', type: 'bigint', nullable: true)]
    private ?int $sizeBytes = null;

    /** 17.1.1.1.5.2.4 Richiesto / non richiesto. */
    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $requested = false;

    #[ORM\Column(type: 'string', length: 20)]
    private string $status = self::STATUS_DA_VERIFICARE;

    /** 17.1.1.1.5.2.2 Note dell'agente (impostate dall'agenzia). */
    #[ORM\Column(name: 'agent_note', type: 'text', nullable: true)]
    private ?string $agentNote = null;

    /** 17.1.1.1.5.2.6 Note del notaio. */
    #[ORM\Column(name: 'notary_note', type: 'text', nullable: true)]
    private ?string $notaryNote = null;

    public function getPractice(): ?Practice
    {
        return $this->practice;
    }

    public function setPractice(?Practice $practice): static
    {
        $this->practice = $practice;

        return $this;
    }

    public function getDocumentType(): ?DocumentType
    {
        return $this->documentType;
    }

    public function setDocumentType(?DocumentType $documentType): static
    {
        $this->documentType = $documentType;

        return $this;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getOriginalFilename(): ?string
    {
        return $this->originalFilename;
    }

    public function setOriginalFilename(?string $originalFilename): static
    {
        $this->originalFilename = $originalFilename;

        return $this;
    }

    public function getStoragePath(): ?string
    {
        return $this->storagePath;
    }

    public function setStoragePath(?string $storagePath): static
    {
        $this->storagePath = $storagePath;

        return $this;
    }

    public function getMimeType(): ?string
    {
        return $this->mimeType;
    }

    public function setMimeType(?string $mimeType): static
    {
        $this->mimeType = $mimeType;

        return $this;
    }

    public function getSizeBytes(): ?int
    {
        return $this->sizeBytes;
    }

    public function setSizeBytes(?int $sizeBytes): static
    {
        $this->sizeBytes = $sizeBytes;

        return $this;
    }

    public function isRequested(): bool
    {
        return $this->requested;
    }

    public function setRequested(bool $requested): static
    {
        $this->requested = $requested;

        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function isVerified(): bool
    {
        return $this->status === self::STATUS_VERIFICATO;
    }

    public function getStatusLabel(): string
    {
        return $this->isVerified() ? 'Verificato' : 'Da verificare';
    }

    public function getAgentNote(): ?string
    {
        return $this->agentNote;
    }

    public function setAgentNote(?string $agentNote): static
    {
        $this->agentNote = $agentNote;

        return $this;
    }

    public function getNotaryNote(): ?string
    {
        return $this->notaryNote;
    }

    public function setNotaryNote(?string $notaryNote): static
    {
        $this->notaryNote = $notaryNote;

        return $this;
    }

    public function hasFile(): bool
    {
        return $this->storagePath !== null && $this->storagePath !== '';
    }
}
