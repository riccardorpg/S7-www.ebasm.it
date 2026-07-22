<?php

namespace App\Entity\Master;

use App\Entity\Trait\IdTrait;
use App\Entity\Trait\TimestampsTrait;
use App\Repository\Master\AgencyUserIndexRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Indice di login cross-tenant sul DB master.
 *
 * Ogni utente ROLE_AGENCY vive nel DB slave della propria agenzia, ma la sua email è
 * registrata qui (globalmente univoca) con il puntatore alla Company. Al login il
 * sistema risolve l'email su questa tabella → ottiene la Company → il suo dbName →
 * ri-punta lo slave prima di caricare lo User dal DB dell'agenzia.
 */
#[ORM\Entity(repositoryClass: AgencyUserIndexRepository::class)]
#[ORM\Table(name: 'eb_m_agency_user_index')]
#[ORM\UniqueConstraint(name: 'uniq_agency_user_email', columns: ['email'])]
#[ORM\HasLifecycleCallbacks]
class AgencyUserIndex
{
    use IdTrait;
    use TimestampsTrait;

    #[ORM\Column(type: 'string', length: 191, unique: true)]
    private ?string $email = null;

    #[ORM\ManyToOne(targetEntity: Company::class, inversedBy: 'userIndex')]
    #[ORM\JoinColumn(name: 'company_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Company $company = null;

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(?string $email): static
    {
        $this->email = $email !== null ? mb_strtolower(trim($email)) : null;

        return $this;
    }

    public function getCompany(): ?Company
    {
        return $this->company;
    }

    public function setCompany(?Company $company): static
    {
        $this->company = $company;

        return $this;
    }
}
