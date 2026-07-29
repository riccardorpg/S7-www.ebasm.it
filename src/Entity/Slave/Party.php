<?php

namespace App\Entity\Slave;

use Doctrine\ORM\Mapping as ORM;

/**
 * Anagrafica di una parte della pratica (acquirente o venditore).
 * Embeddable: i campi vengono inclusi in eb_s_pratica con prefisso (buyer_/seller_).
 */
#[ORM\Embeddable]
class Party
{
    #[ORM\Column(type: 'string', length: 190, nullable: true)]
    private ?string $name = null;

    /** Codice fiscale o P. IVA. */
    #[ORM\Column(name: 'fiscal_code', type: 'string', length: 32, nullable: true)]
    private ?string $fiscalCode = null;

    #[ORM\Column(type: 'string', length: 190, nullable: true)]
    private ?string $email = null;

    #[ORM\Column(type: 'string', length: 40, nullable: true)]
    private ?string $phone = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $address = null;

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getFiscalCode(): ?string
    {
        return $this->fiscalCode;
    }

    public function setFiscalCode(?string $fiscalCode): static
    {
        $this->fiscalCode = $fiscalCode;

        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(?string $email): static
    {
        $this->email = $email;

        return $this;
    }

    public function getPhone(): ?string
    {
        return $this->phone;
    }

    public function setPhone(?string $phone): static
    {
        $this->phone = $phone;

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

    public function isEmpty(): bool
    {
        return ($this->name ?? '') === '' && ($this->fiscalCode ?? '') === '';
    }
}
