<?php

namespace App\Controller\Trait;

/**
 * Lettura delle date che arrivano dai form (datepicker in formato gg-mm-aaaa).
 *
 * DateTimeImmutable::createFromFormat() da solo non basta: è tollerante e converte
 * "99-99-9999" in una data valida traboccando mesi e giorni. Serve controllare anche
 * getLastErrors(), altrimenti una data assurda entra a database.
 */
trait ParsesDatesTrait
{
    /**
     * @return \DateTimeImmutable|null|false null = campo vuoto, false = formato non valido
     */
    private function parseDate(string $value): \DateTimeImmutable|null|false
    {
        $value = trim($value);
        if ($value === '') {
            return null;
        }

        // '!' azzera l'orario: restano solo giorno, mese e anno.
        foreach (['d-m-Y', 'Y-m-d'] as $format) {
            $date = \DateTimeImmutable::createFromFormat('!' . $format, $value);
            if ($date !== false && \DateTimeImmutable::getLastErrors() === false) {
                return $date;
            }
        }

        return false;
    }

    /**
     * Intervallo del daterangepicker, nella forma "gg-mm-aaaa/gg-mm-aaaa".
     * Gli estremi non validi vengono ignorati, così un filtro storto non fa fallire la pagina.
     *
     * @return array{0: ?\DateTimeImmutable, 1: ?\DateTimeImmutable} [da, a]
     */
    private function parseDateRange(string $value): array
    {
        $parts = array_map('trim', explode('/', trim($value)));
        $from = $this->parseDate($parts[0] ?? '');
        $to = $this->parseDate($parts[1] ?? '');

        return [
            $from instanceof \DateTimeImmutable ? $from : null,
            $to instanceof \DateTimeImmutable ? $to : null,
        ];
    }
}
