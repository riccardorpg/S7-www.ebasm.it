<?php

namespace App\Entity\Slave;

use App\Entity\Trait\ActiveTrait;
use App\Entity\Trait\IdTrait;
use App\Entity\Trait\TimestampsTrait;
use App\Repository\Slave\PracticeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

/**
 * 17.1.1.1 Pratica (Practice): vive nel DB dell'agenzia (slave). Inserita dall'agenzia,
 * gestita dal notaio (verifica documenti, completamento, archiviazione).
 */
#[ORM\Entity(repositoryClass: PracticeRepository::class)]
#[ORM\Table(name: 'eb_s_practice')]
#[ORM\HasLifecycleCallbacks]
class Practice
{
    use IdTrait;
    use ActiveTrait;
    use TimestampsTrait;

    // 17.1.1.2 Stati del ciclo di vita.
    public const STATUS_APERTA = 'aperta';
    public const STATUS_COMPLETATA = 'completata';
    public const STATUS_ARCHIVIABILE = 'archiviabile';

    /** Numero/protocollo pratica. */
    #[ORM\Column(type: 'string', length: 60)]
    private string $number = '';

    /** Tipo pratica (es. Compravendita, Successione, Donazione). */
    #[ORM\Column(type: 'string', length: 80, nullable: true)]
    private ?string $type = null;

    /** Oggetto/immobile della pratica. */
    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $subject = null;

    /** 11.2.3.7 Indirizzo dell'immobile oggetto della pratica. */
    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $address = null;

    #[ORM\Column(type: 'string', length: 20)]
    private string $status = self::STATUS_APERTA;

    /** Notaio con accesso alla pratica (email dell'utente master). Null = tutti. */
    #[ORM\Column(name: 'notary_email', type: 'string', length: 190, nullable: true)]
    private ?string $notaryEmail = null;

    /**
     * 11. Le parti sono clienti dell'agenzia (anagrafica riutilizzabile), non più
     * un'anagrafica ricopiata dentro la pratica. RESTRICT: un cliente con pratiche
     * collegate non si può cancellare.
     */
    #[ORM\ManyToOne(targetEntity: Customer::class)]
    #[ORM\JoinColumn(name: 'buyer_customer_id', referencedColumnName: 'id', nullable: true, onDelete: 'RESTRICT')]
    private ?Customer $buyer = null;

    #[ORM\ManyToOne(targetEntity: Customer::class)]
    #[ORM\JoinColumn(name: 'seller_customer_id', referencedColumnName: 'id', nullable: true, onDelete: 'RESTRICT')]
    private ?Customer $seller = null;

    /** @var Collection<int, Document> */
    #[ORM\OneToMany(mappedBy: 'practice', targetEntity: Document::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $documents;

    public function __construct()
    {
        $this->documents = new ArrayCollection();
    }

    public function getNumber(): string
    {
        return $this->number;
    }

    public function setNumber(string $number): static
    {
        $this->number = $number;

        return $this;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(?string $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getSubject(): ?string
    {
        return $this->subject;
    }

    public function setSubject(?string $subject): static
    {
        $this->subject = $subject;

        return $this;
    }

    public function getAddress(): ?string
    {
        return $this->address;
    }

    public function setAddress(?string $address): static
    {
        $this->address = $address;

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

    public function getStatusLabel(): string
    {
        return match ($this->status) {
            self::STATUS_COMPLETATA => 'Completata',
            self::STATUS_ARCHIVIABILE => 'Archiviabile',
            default => 'Aperta',
        };
    }

    public function getNotaryEmail(): ?string
    {
        return $this->notaryEmail;
    }

    public function setNotaryEmail(?string $notaryEmail): static
    {
        $this->notaryEmail = $notaryEmail;

        return $this;
    }

    public function getBuyer(): ?Customer
    {
        return $this->buyer;
    }

    public function setBuyer(?Customer $buyer): static
    {
        $this->buyer = $buyer;

        return $this;
    }

    public function getSeller(): ?Customer
    {
        return $this->seller;
    }

    public function setSeller(?Customer $seller): static
    {
        $this->seller = $seller;

        return $this;
    }

    /** @return Collection<int, Document> */
    public function getDocuments(): Collection
    {
        return $this->documents;
    }

    public function addDocument(Document $document): static
    {
        if (!$this->documents->contains($document)) {
            $this->documents->add($document);
            $document->setPractice($this);
        }

        return $this;
    }

    public function removeDocument(Document $document): static
    {
        if ($this->documents->removeElement($document)) {
            if ($document->getPractice() === $this) {
                $document->setPractice(null);
            }
        }

        return $this;
    }

    /** Numero di documenti effettivamente caricati. */
    public function countUploaded(): int
    {
        return $this->documents->filter(fn (Document $d) => $d->hasFile())->count();
    }

    /** Numero di documenti marcati come richiesti. */
    public function countRequested(): int
    {
        return $this->documents->filter(fn (Document $d) => $d->isRequested())->count();
    }
}
