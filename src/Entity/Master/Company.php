<?php

namespace App\Entity\Master;

use App\Entity\Trait\ActiveTrait;
use App\Entity\Trait\IdTrait;
use App\Entity\Trait\TimestampsTrait;
use App\Repository\Master\CompanyRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

/**
 * Registro agenzia (tenant) sul DB master.
 * $dbName è il nome del database slave dedicato all'agenzia, verso cui
 * DynamicConnection ri-punta la connessione 'slave' a runtime.
 */
#[ORM\Entity(repositoryClass: CompanyRepository::class)]
#[ORM\Table(name: 'eb_m_company')]
#[ORM\HasLifecycleCallbacks]
class Company
{
    use IdTrait;
    use ActiveTrait;
    use TimestampsTrait;

    #[ORM\Column(type: 'string', length: 64, unique: true)]
    private ?string $code = null;

    #[ORM\Column(type: 'string', length: 191)]
    private ?string $name = null;

    #[ORM\Column(name: 'db_name', type: 'string', length: 191, unique: true)]
    private ?string $dbName = null;

    /** @var Collection<int, AgencyUserIndex> */
    #[ORM\OneToMany(mappedBy: 'company', targetEntity: AgencyUserIndex::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $userIndex;

    public function __construct()
    {
        $this->userIndex = new ArrayCollection();
    }

    public function getCode(): ?string
    {
        return $this->code;
    }

    public function setCode(?string $code): static
    {
        $this->code = $code;

        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getDbName(): ?string
    {
        return $this->dbName;
    }

    public function setDbName(?string $dbName): static
    {
        $this->dbName = $dbName;

        return $this;
    }

    /** @return Collection<int, AgencyUserIndex> */
    public function getUserIndex(): Collection
    {
        return $this->userIndex;
    }

    public function addUserIndex(AgencyUserIndex $entry): static
    {
        if (!$this->userIndex->contains($entry)) {
            $this->userIndex->add($entry);
            $entry->setCompany($this);
        }

        return $this;
    }

    public function removeUserIndex(AgencyUserIndex $entry): static
    {
        if ($this->userIndex->removeElement($entry) && $entry->getCompany() === $this) {
            $entry->setCompany(null);
        }

        return $this;
    }

    public function __toString(): string
    {
        return (string) $this->name;
    }
}
